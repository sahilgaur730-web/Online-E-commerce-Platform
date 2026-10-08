package com.shopkart.service;

import com.shopkart.common.ResourceNotFoundException;
import com.shopkart.dto.AddressDto;
import com.shopkart.model.Address;
import com.shopkart.model.User;
import com.shopkart.repository.AddressRepository;
import com.shopkart.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<AddressDto> getAddressesByUser(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressDto addAddress(Long userId, AddressDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Address> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);

        Address address = new Address();
        address.setUser(user);
        address.setFullName(dto.getFullName());
        address.setPhone(dto.getPhone());
        address.setPincode(dto.getPincode());
        address.setStreetAddress(dto.getStreetAddress());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setLandmark(dto.getLandmark());
        address.setAddressType(dto.getAddressType() != null ? dto.getAddressType() : "HOME");

        if (existing.isEmpty() || dto.isDefault()) {
            address.setDefault(true);
            if (dto.isDefault()) {
                existing.forEach(a -> { a.setDefault(false); addressRepository.save(a); });
            }
        }

        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    @Transactional
    public AddressDto updateAddress(Long userId, Long addressId, AddressDto dto) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        address.setFullName(dto.getFullName());
        address.setPhone(dto.getPhone());
        address.setPincode(dto.getPincode());
        address.setStreetAddress(dto.getStreetAddress());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setLandmark(dto.getLandmark());
        address.setAddressType(dto.getAddressType());

        if (dto.isDefault() && !address.isDefault()) {
            List<Address> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            existing.forEach(a -> { a.setDefault(false); addressRepository.save(a); });
            address.setDefault(true);
        }

        Address saved = addressRepository.save(address);
        return toDto(saved);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        addressRepository.delete(address);
    }

    public AddressDto toDto(Address a) {
        AddressDto dto = new AddressDto();
        dto.setId(a.getId());
        dto.setFullName(a.getFullName());
        dto.setPhone(a.getPhone());
        dto.setPincode(a.getPincode());
        dto.setStreetAddress(a.getStreetAddress());
        dto.setCity(a.getCity());
        dto.setState(a.getState());
        dto.setLandmark(a.getLandmark());
        dto.setAddressType(a.getAddressType());
        dto.setDefault(a.isDefault());
        return dto;
    }
}
